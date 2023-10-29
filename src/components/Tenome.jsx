import { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D from 'react-force-graph-2d';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'; // Ensure you have this dependency
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, runTransaction, updateDoc, arrayUnion, arrayRemove, setDoc, getDoc } from 'firebase/firestore';
import './Tenome.css';
import { useWindowSize, useWindowWidth } from '@react-hook/window-size';
import { useNavigate } from 'react-router-dom';

const initialData = {
    "nodes": [
        {
            "id": "completeness",
            "source": "Nothing by Roy Sorenson",
            "content": "A drive for completeness leads us to postulate larger and larger wholes, ultimately yielding the maximal whole, the World."
        },
        {
            "id": "fiction",
            "source": "Nothing by Roy Sorenson",
            "content": "Participating in a fiction analogous to running downhill. If the slope is gentle, then running gets us to our destination faster. If the hill is steep, then each brisk step forces raises commitment to a yet brisker step. We find ourselves running faster and faster just to stay upright. The initial thrill of acceleration metastases into dread. The reminder 'This is just a game' checks your descent but also deflates interest"
        },

        {
            "id": "experience",
            "source": "Nothing by Roy Sorenson",
            "content": "The experienced player suspends disbelief just enough to enjoy the fruits of the fiction"
        },
        {
            "id": "languages",
            "source": "Nothing by Roy Sorenson",
            "content": "Languages indicate grammatical roles by either marking the words themselves (as in plural dogs) or by marking the role with word order ('Man bites dog' is parsed different from 'Dog bites man' despite having the same words)."
        },
        {
            "id": "shadows",
            "source": "Nothing by Roy Sorenson",
            "content": "'The shadow of a flying bird as never stirred.' According to Mo Tzu (300 BC), no shadow can stir. Shadows exist only for an instant. They do not persist through time. The bird persists through time because one stage of the bird causes the next stage. Shadows lack this immanent causation."
        },
        {
            "id": "neuroscience",
            "content": "Neuroscience is the scientific study of the nervous system. Traditionally, neuroscience has been seen as a branch of biology. However, it is currently an interdisciplinary science that collaborates with other fields such as chemistry, computer science, engineering, linguistics, mathematics, medicine and allied disciplines, philosophy, physics, and psychology. It also exerts influence on other fields, such as neuroeducation and neurolaw. The term neurobiology is usually used interchangeably with the term neuroscience, although the former refers specifically to the biology of the nervous system, whereas the latter refers to the entire science of the nervous system, including elements of psychology as well as the purely physical sciences."
        }
    ],

    "links": [
        {
            "id": "completeness + fiction",
            "source": "completeness",
            "target": "fiction"
        },
        {
            "id": "fiction + experience",
            "source": "fiction",
            "target": "experience"
        },
        {
            "id": "fiction + languages",
            "source": "fiction",
            "target": "languages"
        },
        {
            "id": "languages + shadows",
            "source": "languages",
            "target": "shadows"
        },
        {
            "id": "languages + neuroscience",
            "source": "languages",
            "target": "neuroscience"
        }
    ]
};

function Tenome() {
    const [graphData, setGraphData] = useState(null);
    const [selectedNode, setSelectedNode] = useState(null);
    const [isEditable, setIsEditable] = useState(false);
    const [width, height] = useWindowSize();
    const [bloomPass, setBloomPass] = useState(null);
    const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0 });
    const [rightClickedNode, setRightClickedNode] = useState(null);
    const [isShiftKeyDown, setIsShiftKeyDown] = useState(false);
    const [rightClickedLink, setRightClickedLink] = useState(null);
    const [is2DView, setis2DView] = useState(true);
    const [position, setPosition] = useState({ x: 100, y: 150 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });
    const [activeButton, setActiveButton] = useState(null); // 'search', 'journey', or 'browse'
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const navigate = useNavigate();

    const handleGoToHome = () => {
        navigate('/'); // This assumes that your homepage route is '/'
    };

    const handleButtonClick = (button) => {
        setActiveButton(button);
        // Reset any previous search input and suggestions
        setSearchInput('');
        setSuggestions([]);
    };
    const handleSearchInputChange = (e) => {
        setSearchInput(e.target.value);
        // Populate suggestions based on the current graph data
        const matchedNodes = graphData.nodes.filter(node => node.id.includes(e.target.value));
        setSuggestions(matchedNodes);
    };

    const handleSearchKeyPress = (e) => {
        if (e.key === 'Enter' && suggestions.length === 1) {
            setSelectedNode(suggestions[0]); // Select the only matched node
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            setPosition({ x: e.clientX - startPosition.x, y: e.clientY - startPosition.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, startPosition]);

    // Firebase config stuff:
    const fgRef = useRef();

    const db = getFirestore();
    const auth = getAuth();
    const user = auth.currentUser;

    // Get data from firebase:
    useEffect(() => {
        const fetchData = async () => {
            try {
                const docRef = doc(db, 'tenomeData', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setGraphData(docSnap.data());
                } else {
                    await setDoc(docRef, initialData);
                    setGraphData(initialData);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, [db, user]);

    window.addEventListener('resize', () => {
        setDisplayWidth(window.innerWidth);
        setDisplayHeight(window.innerHeight);
    });

    const selectedNodeRef = useRef(null);
    const currentEnterListenerRef = useRef(null);
    
    const handleNodeClick = (node, event) => {
        console.log("Clicked node:", node);

        // If Shift key is down and there's a previously selected node
        if (isShiftKeyDown && selectedNode) {
            // Create a new link between selectedNode and the newly clicked node
            const newLink = {
                id: `${selectedNode.id}-${node.id}`,
                source: selectedNode.id,
                target: node.id
            };

            // Check if the link already exists
            const linkExists = graphData.links.some(link =>
                (link.source === newLink.source && link.target === newLink.target) ||
                (link.source === newLink.target && link.target === newLink.source)
            );

            if (!linkExists) {
                // Add this new link to the graphData
                setGraphData(prevData => ({
                    nodes: [...prevData.nodes],
                    links: [...prevData.links, newLink]
                }));

                // Add the link to Firebase
                const docRef = doc(db, 'tenomeData', user.uid);
                updateDoc(docRef, {
                    links: arrayUnion(newLink)
                })
                    .then(() => {
                        console.log("Link successfully added with ID: ", newLink.id);
                    })
                    .catch(error => {
                        console.error("Error adding link: ", error);
                    });
            } else {
                console.log("Link already exists!");
            }

            // Clear the selection after creating a link
            setSelectedNode(null);
        } else {
            // If no Shift key is down or there's no previously selected node, set the clicked node as the selected node
            setSelectedNode(node);
            selectedNodeRef.current = node; // Update the ref with the new node
        }

        if (currentEnterListenerRef.current) {
            window.removeEventListener("keydown", currentEnterListenerRef.current);
        }

        const handleEnterPress = (e) => {
            if (e.key === "Enter") {
                console.log(selectedNodeRef.current)
                if (selectedNodeRef.current) {
                    createNewLinkedNode(selectedNodeRef.current);
                }
            }
        };

        // Store the latest listener in the ref
        currentEnterListenerRef.current = handleEnterPress;
        window.addEventListener("keydown", handleEnterPress);
    };

    const handleNodeRightClick = (node, event) => {
        event.preventDefault(); // Prevent the browser's default right-click menu
        console.log("Node right-clicked:", node);

        setTooltip({
            visible: true,
            x: event.pageX - 100,
            y: event.pageY - 150
        });
        setSelectedNode(node);
        setRightClickedNode(node);
    };

    const generateRandomString = (length = 6) => {
        return Math.random().toString(36).substr(2, length);
    };

    let isTransactionRunning = false;

    const createNewLinkedNode = async (baseNode) => {
        if (isTransactionRunning) {
            console.error('Transaction is already running');
            return;
        }

        isTransactionRunning = true;

        const newNodeId = generateRandomString();

        const newLink = {
            id: `${baseNode.id} + ${newNodeId}`,
            source: baseNode.id,
            target: newNodeId,
        };

        const newNode = {
            id: newNodeId,
            content: '', // You can set default content here or leave it empty
        };

        setGraphData(prevData => ({
            nodes: [...prevData.nodes, newNode],
            links: [...prevData.links, newLink],
        }));

        // Define the changes to be saved
        const changes = {
            newNode: {
                id: newNode.id,
                content: newNode.content
            },
            newLink: {
                id: newLink.id,
                source: newLink.source,
                target: newLink.target
            }
        };

        // Log the changes before pushing to Firestore
        console.log("Changes to be saved:", changes);

        // Save the new node and link to Firestore
        const docRef = doc(db, 'tenomeData', user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error('Document does not exist!');
                }

                let currentNodes = docSnap.data().nodes;
                let currentLinks = docSnap.data().links;

                // Check if newNode and newLink already exist based on their 'id' property
                if (!currentNodes.some(node => node.id === changes.newNode.id)) {
                    currentNodes = [...currentNodes, changes.newNode];
                }

                if (!currentLinks.some(link => link.id === changes.newLink.id)) {
                    currentLinks = [...currentLinks, changes.newLink];
                }

                transaction.update(docRef, {
                    nodes: currentNodes,
                    links: currentLinks
                });
            });

        } catch (error) {
            console.error("Error updating data:", error);
        } finally {
            isTransactionRunning = false;  // Reset the flag after the transaction completes
        }
    };

    const handleLinkRightClick = (link, event) => {
        event.preventDefault(); // Prevent the browser's default right-click menu
        setTooltip({
            visible: true,
            x: event.pageX - 100,
            y: event.pageY - 150
        });
        setRightClickedLink(link);
    };

    const handleInputChange = (e) => {
        setSelectedNode(prev => ({
            ...prev,
            id: e.target.name === 'nodeId' ? e.target.value : prev.id,
            content: e.target.name === 'nodeContent' ? e.target.value : prev.content,
        }));
    };

    const handleSave = async () => {
        if (selectedNode) {
            const nodeId = document.querySelector('.overlay .input-container input').value;
            const nodeContent = document.querySelector('.overlay .textarea-container textarea').value;

            const docRef = doc(db, 'tenomeData', user.uid);

            if (nodeId && nodeContent) {
                const oldNodeId = selectedNode.id;

                const newNodeForFirebase = {
                    id: nodeId,
                    content: nodeContent
                };

                await runTransaction(db, async (transaction) => {
                    const docSnap = await transaction.get(docRef);
                    if (!docSnap.exists()) {
                        throw new Error('Document does not exist!');
                    }

                    let currentData = docSnap.data();

                    let nodesArray = currentData.nodes;

                    nodesArray = nodesArray.filter(node => node.id !== oldNodeId);
                    nodesArray.push(newNodeForFirebase);

                    let linksArray = currentData.links;

                    if (nodeId !== oldNodeId) {
                        linksArray = linksArray.map(link => {
                            if (link.source === oldNodeId) {
                                return { ...link, source: nodeId };
                            } else if (link.target === oldNodeId) {
                                return { ...link, target: nodeId };
                            } else {
                                return link;
                            }
                        });
                    }

                    transaction.set(docRef, {
                        nodes: nodesArray,
                        links: linksArray
                    });
                });

                setIsEditable(false);
            }
        }
    };

    const deleteNode = async () => {
        if (!rightClickedNode) return; // Return early if no node selected

        const docRef = doc(db, 'tenomeData', user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error('Document does not exist!');
                }

                // Filter out the selected node
                const nodesArray = docSnap.data().nodes.filter(node => node.id !== rightClickedNode.id);

                // Filter out the links associated with the selected node
                const linksArray = docSnap.data().links.filter(link => link.source !== rightClickedNode.id && link.target !== rightClickedNode.id);

                // Save the updated nodes and links
                transaction.set(docRef, {
                    nodes: nodesArray,
                    links: linksArray
                });
            });

            // Update local state to reflect the deletion
            setGraphData(prevData => ({
                nodes: prevData.nodes.filter(node => node.id !== rightClickedNode.id),
                links: prevData.links.filter(link => link.source !== rightClickedNode.id && link.target !== rightClickedNode.id)
            }));

            // Clear the right-clicked node
            setRightClickedNode(null);
            setTooltip({ visible: false });

        } catch (error) {
            console.error("Error deleting node:", error);
        }
    };

    const deleteLink = async () => {
        if (!rightClickedLink) return; // Return early if no link selected

        const docRef = doc(db, 'tenomeData', user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const docSnap = await transaction.get(docRef);
                if (!docSnap.exists()) {
                    throw new Error('Document does not exist!');
                }

                // Filter out the selected link
                const linksArray = docSnap.data().links.filter(link => link.id !== rightClickedLink.id);

                // Save the updated links
                transaction.set(docRef, {
                    nodes: docSnap.data().nodes,
                    links: linksArray
                });
            });

            // Update local state to reflect the deletion
            setGraphData(prevData => ({
                nodes: prevData.nodes,
                links: prevData.links.filter(link => link.id !== rightClickedLink.id)
            }));

            // Clear the right-clicked link
            setRightClickedLink(null);
            setTooltip({ visible: false });

        } catch (error) {
            console.error("Error deleting link:", error);
        }
    };


    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Shift') {
                setIsShiftKeyDown(true);
            }
        };

        const handleKeyUp = (event) => {
            if (event.key === 'Shift') {
                setIsShiftKeyDown(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);


    const handleBackgroundClick = () => {
        setSelectedNode(null);
        setRightClickedLink(null);
        setActiveButton(null); // Reset the active button
        setTooltip({ visible: false });

    };

    // useEffect(() => {
    //     if (fgRef.current) {
    //         const currentBloomPass = new UnrealBloomPass();
    //         currentBloomPass.strength = 1.4;
    //         currentBloomPass.radius = 0.4;
    //         currentBloomPass.threshold = 0;

    //         const composer = fgRef.current && fgRef.current.postProcessingComposer ? fgRef.current.postProcessingComposer() : null;

    //         if (composer) {
    //             // Remove the existing bloom pass if it exists
    //             if (bloomPass) {
    //                 composer.removePass(bloomPass);
    //             }

    //             composer.addPass(currentBloomPass);
    //             setBloomPass(currentBloomPass);
    //         }
    //     }
    // }, [graphData]); // Run this effect when graphData is set


    return (
        <div>
            <div id="buttons-container">
                <button className="action-button" id="journey-button" onClick={() => handleButtonClick('journey')}>Journey</button>
                <button className="action-button" id="home-button" onClick={handleGoToHome}>Home</button>
                {activeButton !== 'search' && <button className="action-button" id="search-button" onClick={() => handleButtonClick('search')}>Search</button>}
                {activeButton === 'search' &&
                    <div>
                        <input
                            id="node-search"
                            type="text"
                            value={searchInput}
                            onChange={handleSearchInputChange}
                            onKeyPress={handleSearchKeyPress}
                        />
                        <div className="suggestions-box">
                            {suggestions.map(suggestion => (
                                <div key={suggestion.id} onClick={() => setSelectedNode(suggestion)}>
                                    {suggestion.id}
                                </div>
                            ))}
                        </div>
                    </div>
                }
            </div>
            <div
                className="overlay"
                style={{ left: `${position.x}px`, top: `${position.y}px`, position: 'absolute' }}
                onMouseDown={handleMouseDown}
            >
                <div className="input-container">
                    <input
                        type="text"
                        name="nodeId" // added name attribute to identify the input
                        value={selectedNode ? selectedNode.id : ''}
                        readOnly={!isEditable}
                        onChange={handleInputChange} // capture input changes
                    />
                    <button id="edit-button" onClick={() => setIsEditable(!isEditable)}>
                        {isEditable ? "Cancel" : "Edit"}
                    </button>
                </div>
                <div className="textarea-container">
                    <textarea
                        name="nodeContent" // added name attribute to identify the textarea
                        value={selectedNode ? selectedNode.content : ''}
                        readOnly={!isEditable}
                        onChange={handleInputChange} // capture textarea changes
                    />
                    {isEditable && <button id="save-button" onClick={handleSave}>Save</button>}
                </div>
                <div className="tooltip" style={{
                    display: tooltip.visible ? 'block' : 'none',
                    left: tooltip.x,
                    top: tooltip.y
                }}
                >
                    {rightClickedNode && <div onClick={deleteNode} className="tooltip-option">Delete Node</div>}
                    {rightClickedLink && <div onClick={deleteLink} className="tooltip-option">Delete Link</div>}
                </div>
            </div>
            <button
                className="toggle-view-button"
                onClick={() => setis2DView(!is2DView)}
                style={{ position: 'fixed', bottom: '10px', right: '10px' }}
            >
                {is2DView ? '2D' : '3D'}
            </button>
            {graphData && (
                is2DView ? (
                    <ForceGraph2D
                        ref={fgRef}
                        width={width}
                        height={height}
                        backgroundColor="#fff"
                        graphData={graphData}
                        nodeLabel="id"
                        onBackgroundClick={handleBackgroundClick}
                        onNodeClick={handleNodeClick}
                        onNodeRightClick={handleNodeRightClick}
                        onLinkRightClick={handleLinkRightClick}
                        nodeColor={node => node === selectedNode ? 'red' : 'black'}
                        linkColor={link => link === rightClickedLink ? 'red' : 'black'}
                    />
                ) : (
                    <ForceGraph3D
                        ref={fgRef}
                        width={width}
                        height={height}
                        backgroundColor="#fff"
                        graphData={graphData}
                        nodeLabel="id"
                        onBackgroundClick={handleBackgroundClick}
                        onNodeClick={handleNodeClick}
                        onNodeRightClick={handleNodeRightClick}
                        nodeColor={node => node === selectedNode ? 'red' : 'black'}
                        nodeOpacity={1}
                        linkColor={link => link === rightClickedLink ? 'red' : 'black'}
                    />
                )
            )}
        </div>
    );
}


export default Tenome;
