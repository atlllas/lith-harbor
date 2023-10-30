import React from 'react';

export default function TFIDFComponent() {

    const computeTF = (wordDict, doc) => {
        let tfDict = {};
        let docCount = doc.split(" ").length;
        for (let word in wordDict) {
            tfDict[word] = wordDict[word] / docCount;
        }
        return tfDict;
    }

    const computeIDF = (docList) => {
        let idfDict = {};
        let N = docList.length;
        let wordDictList = [];

        for (let doc of docList) {
            let wordDict = {};
            for (let word of doc.split(" ")) {
                wordDict[word] = (wordDict[word] || 0) + 1;
            }
            wordDictList.push(wordDict);
        }

        for (let wordDict of wordDictList) {
            for (let word in wordDict) {
                idfDict[word] = Math.log(N / (idfDict[word] || 0 + 1));
            }
        }

        return idfDict;
    }

    const computeTFIDF = (tfDict, idfDict) => {
        let tfidfDict = {};
        for (let word in tfDict) {
            tfidfDict[word] = tfDict[word] * (idfDict[word] || 0);
        }
        return tfidfDict;
    }

    // Example usage:
    const docA = "A drive for completeness";
    const docB = "Participating in a fiction analogous to running downhill";
    const docList = [docA, docB];

    const idfDict = computeIDF(docList);

    const tfidfA = computeTFIDF(computeTF(docA, docA), idfDict);
    const tfidfB = computeTFIDF(computeTF(docB, docB), idfDict);

    console.log(tfidfA);
    console.log(tfidfB);

    const cosineSimilarity = (vecA, vecB) => {
        const dotProduct = (vecA, vecB) => {
            let product = 0;
            for (let key in vecA) {
                if (vecB.hasOwnProperty(key)) {
                    product += vecA[key] * vecB[key];
                }
            }
            return product;
        }
    
        const magnitude = (vec) => {
            let sum = 0;
            for (let key in vec) {
                sum += Math.pow(vec[key], 2);
            }
            return Math.sqrt(sum);
        }
    
        return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
    }
}

