import { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import ForceGraph2D from 'react-force-graph-2d';
import './Tenome.css';
import { useWindowSize, useWindowWidth } from '@react-hook/window-size';
import { useNavigate } from 'react-router-dom';
import { tokenize, tfidf, cosineSimilarity } from './tfidfHelpers'; // assuming both files are in the same directory

const LOCAL_STORAGE_KEY = 'tenomeGraphData';

const initialData = {
    "nodes": [
        {
            "id": "completeness",
            "content": "A drive for completeness leads us to postulate larger and larger wholes, ultimately yielding the maximal whole, the World."
        },
        {
            "id": "fiction",
            "content": "Participating in a fiction analogous to running downhill. If the slope is gentle, then running gets us to our destination faster. If the hill is steep, then each brisk step forces raises commitment to a yet brisker step. We find ourselves running faster and faster just to stay upright. The initial thrill of acceleration metastases into dread. The reminder 'This is just a game' checks your descent but also deflates interest"
        },

        {
            "id": "experience",
            "content": "The experienced player suspends disbelief just enough to enjoy the fruits of the fiction"
        },
        {
            "id": "languages",
            "content": "Languages indicate grammatical roles by either marking the words themselves (as in plural dogs) or by marking the role with word order ('Man bites dog' is parsed different from 'Dog bites man' despite having the same words)."
        },
        {
            "id": "shadows",
            "content": "'The shadow of a flying bird as never stirred.' According to Mo Tzu (300 BC), no shadow can stir. Shadows exist only for an instant. They do not persist through time. The bird persists through time because one stage of the bird causes the next stage. Shadows lack this immanent causation."
        },
        {
            "id": "neuroscience",
            "content": "Neuroscience is the scientific study of the nervous system. Traditionally, neuroscience has been seen as a branch of biology. However, it is currently an interdisciplinary science that collaborates with other fields such as chemistry, computer science, engineering, linguistics, mathematics, medicine and allied disciplines, philosophy, physics, and psychology. It also exerts influence on other fields, such as neuroeducation and neurolaw. The term neurobiology is usually used interchangeably with the term neuroscience, although the former refers specifically to the biology of the nervous system, whereas the latter refers to the entire science of the nervous system, including elements of psychology as well as the purely physical sciences."
        }
    ],

    "links": [
        {
            "source": "completeness",
            "target": "fiction"
        },
        {
            "source": "fiction",
            "target": "experience"
        },
        {
            "source": "fiction",
            "target": "languages"
        },
        {
            "source": "languages",
            "target": "shadows"
        },
        {
            "source": "languages",
            "target": "neuroscience"
        }
    ]
};

function Tenome() {
    const [selectedNode, setSelectedNode] = useState(null);
    const [isEditable, setIsEditable] = useState(false);
    const [width, height] = useWindowSize();
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
    const [graphData, setGraphData] = useState(initialData);

    // Navigation stuff

    const navigate = useNavigate();
    const handleGoToHome = () => navigate('/');

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

    // Text editor dragging
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


    // TFIDF editor
    const thresholdSlider = useRef(null);
    const thresholdValue = useRef(null);

    useEffect(() => {
        if (thresholdSlider.current && thresholdValue.current) {
            thresholdSlider.current.addEventListener('input', function () {
                thresholdValue.current.textContent = this.value;

                const percentage = (this.value - this.min) / (this.max - this.min);
                const leftPosition = percentage * this.offsetWidth;
                thresholdValue.current.style.left = `${leftPosition}px`;
            });
        }
    }, []);

    const displayThresholdUI = () => {
        if (thresholdSlider.current && thresholdValue.current) {
            const isHidden = thresholdSlider.current.style.opacity === "0" || thresholdSlider.current.style.opacity === "";
            thresholdSlider.current.style.opacity = isHidden ? "1" : "0";
            thresholdValue.current.style.opacity = isHidden ? "1" : "0";
            document.getElementById("applyButton").style.opacity = isHidden ? "1" : "0";
        }
    };

    const handleConnect = () => {

        const threshold = parseFloat(thresholdSlider.value); // Get value from slider
        const newLinks = [];

        for (let i = 0; i < graphData.nodes.length; i++) {
            for (let j = i + 1; j < graphData.nodes.length; j++) {
                const nodeA = graphData.nodes[i];
                const nodeB = graphData.nodes[j];

                const tokensA = tokenize(nodeA.content);
                const tokensB = tokenize(nodeB.content);

                const terms = new Set([...tokensA, ...tokensB]);

                let tfidfA = {};
                let tfidfB = {};

                for (let term of terms) {
                    tfidfA[term] = tfidf(term, tokensA, [nodeA.content, nodeB.content]);
                    tfidfB[term] = tfidf(term, tokensB, [nodeA.content, nodeB.content]);
                }

                const similarity = cosineSimilarity(tfidfA, tfidfB);

                if (similarity > threshold) {
                    newLinks.push({
                        id: `${nodeA.id} + ${nodeB.id}`,
                        source: nodeA.id,
                        target: nodeB.id
                    });
                }
            }
        }

        setGraphData(prevData => ({
            nodes: [...prevData.nodes],
            links: [...new Set([...prevData.links, ...newLinks])] // Avoid duplicate links
        }));
    };

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(graphData));
    }, [graphData]);

    useEffect(() => {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            setGraphData(JSON.parse(savedData));
        } else {
            // If there's no saved data, use the initialData and save it to localStorage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialData));
            setGraphData(initialData);
        }
    }, []);


    // Ref for node interactions;
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

    const updateGraphData = (newGraphData) => {
        setGraphData(newGraphData);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newGraphData));
    };

    const createNewLinkedNode = (baseNode) => {
        const newNodeId = generateRandomString();
        const newLink = {
            id: `${baseNode.id} + ${newNodeId}`,
            source: baseNode.id,
            target: newNodeId,
        };
        const newNode = {
            id: newNodeId,
            content: '', // Set default content or leave empty
        };

        updateGraphData({
            nodes: [...graphData.nodes, newNode],
            links: [...graphData.links, newLink],
        });
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

    const handleSave = () => {
        if (selectedNode) {
            const oldNodeId = selectedNodeRef.current.id; // The old Node ID
            const newNodeId = selectedNode.id;
            const nodeContent = selectedNode.content;
    
            // Update the nodes with the new ID and content
            const newNodesArray = graphData.nodes.map((node) =>
                node.id === oldNodeId ? { ...node, id: newNodeId, content: nodeContent } : node
            );
    
            // Find the actual node objects for the old ID
            const oldNodeObject = graphData.nodes.find(node => node.id === oldNodeId);
            const newNodeObject = newNodesArray.find(node => node.id === newNodeId);
    
            // Update the links to reference the new node object if necessary
            const newLinksArray = graphData.links.map((link) => {
                let updatedLink = { ...link };
                if (link.source === oldNodeObject) {
                    updatedLink.source = newNodeObject;
                }
                if (link.target === oldNodeObject) {
                    updatedLink.target = newNodeObject;
                }
                return updatedLink;
            });
    
            // Log the updated graph data
            console.log({
                nodes: newNodesArray,
                links: newLinksArray // Updated links array
            });
    
            // Update the graph data with the new nodes and links
            updateGraphData({ nodes: newNodesArray, links: newLinksArray });
            setIsEditable(false);
            // Clear the selected node
            setSelectedNode(null);
        }
    };
    
    const deleteNode = () => {
        if (!rightClickedNode) return;

        const newNodes = graphData.nodes.filter(node => node.id !== rightClickedNode.id);
        const newLinks = graphData.links.filter(link => link.source !== rightClickedNode.id && link.target !== rightClickedNode.id);

        updateGraphData({
            nodes: newNodes,
            links: newLinks
        });

        setRightClickedNode(null);
        setTooltip({ visible: false });
    };

    const deleteLink = () => {
        if (!rightClickedLink) return;

        const newLinks = graphData.links.filter(link => link.id !== rightClickedLink.id);
        updateGraphData({
            ...graphData,
            links: newLinks
        });

        setRightClickedLink(null);
        setTooltip({ visible: false });
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

    const handleClearGraph = () => {
        console.log('Current graph data before clearing:', graphData);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setGraphData(initialData);
    };

    const handleDownloadGraph = () => {
        // Prepare the nodes data by extracting only the necessary properties
        const nodesToDownload = graphData.nodes.map(node => ({
            id: node.id,
            source: node.source,
            content: node.content
        }));

        // Prepare the links data by extracting only the necessary properties
        const linksToDownload = graphData.links.map(link => ({
            source: link.source.id, // Assuming the source and target in your graphData are objects with an id property
            target: link.target.id
        }));

        // Combine nodes and links into a single object for download
        const dataToDownload = {
            nodes: nodesToDownload,
            links: linksToDownload
        };

        // Convert it to a string and create a blob
        const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' });

        // Create a link element, set the download attribute with a filename
        const link = document.createElement('a');
        link.download = 'graph-data.json';

        // Create a URL for the blob and set it as href on the link element
        link.href = window.URL.createObjectURL(blob);

        // Append the link to the body, click it, and then remove it
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleUploadGraph = (event) => {
        const fileReader = new FileReader();
        const file = event.target.files[0];

        fileReader.readAsText(file);

        fileReader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                // Assuming you have a state variable called `graphData`
                if (jsonData.nodes && jsonData.links) {
                    setGraphData(jsonData); // Use your state update function here
                } else {
                    console.error("Invalid file format");
                }
            } catch (error) {
                console.error("Error reading JSON:", error);
            }
        };

        fileReader.onerror = () => {
            console.error("There was an error reading the file");
        };

        event.target.value = '';
    };

    const handleBackgroundClick = () => {
        setSelectedNode(null);
        setRightClickedLink(null);
        setActiveButton(null); // Reset the active button
        setTooltip({ visible: false });

    };

    return (
        <div>
            <div id="actions-container">
                <button className="interact-button" id="remixButton" onClick={displayThresholdUI}>Remix</button>
                <div id="threshold-container">
                    <label htmlFor="thresholdSlider"><span id="thresholdValue" ref={thresholdValue}>0.9</span></label>
                    <input type="range" id="thresholdSlider" min="0" max="1" step="0.01" defaultValue="0.9" ref={thresholdSlider} />
                    <button id="applyButton" onClick={handleConnect}></button>
                </div>
                <input type="file" id="fileInput" style={{ display: 'none' }} accept=".json" onChange={handleUploadGraph} />
                <button className="interact-button" id="uploadButton" onClick={() => document.getElementById('fileInput').click()}>Upload</button>
                <button className="interact-button" id="downloadButton" onClick={handleDownloadGraph}>Download</button>
                <button className="interact-button" id="clearButton" onClick={handleClearGraph}>Clear</button>

            </div>
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
                        width={width}
                        height={height}
                        backgroundColor="#000"
                        graphData={graphData}
                        nodeLabel="id"
                        onBackgroundClick={handleBackgroundClick}
                        onNodeClick={handleNodeClick}
                        onNodeRightClick={handleNodeRightClick}
                        onLinkRightClick={handleLinkRightClick}
                        nodeColor={node => node === selectedNode ? 'red' : 'white'}
                        linkColor={link => link === rightClickedLink ? 'red' : 'white'}
                    />
                ) : (
                    <ForceGraph3D
                        width={width}
                        height={height}
                        backgroundColor="#000"
                        graphData={graphData}
                        nodeLabel="id"
                        onBackgroundClick={handleBackgroundClick}
                        onNodeClick={handleNodeClick}
                        onNodeRightClick={handleNodeRightClick}
                        nodeColor={node => node === selectedNode ? 'red' : 'white'}
                        nodeOpacity={1}
                        linkColor={link => link === rightClickedLink ? 'red' : 'white'}
                    />
                )
            )}
        </div>
    );
}


export default Tenome;
