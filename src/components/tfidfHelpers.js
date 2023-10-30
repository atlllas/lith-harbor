const stopWords = ["and", "the", "to", "of", "in", "is", "it", "you", "that", "a", "for", "on"]

export const tokenize = (text) => {
    let tokens = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").split(/\s+/);
    return tokens.filter(word => !stopWords.includes(word) && word.length > 1);
};


const normalize = (vec) => {
    const magnitude = Object.values(vec).reduce((sum, val) => sum + val * val, 0);
    const magnitudeRoot = Math.sqrt(magnitude);
    for (let term in vec) {
        vec[term] = vec[term] / magnitudeRoot;
    }
    return vec;
};


export const termFrequency = (term, tokens) => {
    return tokens.filter(token => token === term).length / tokens.length;
};

export const inverseDocumentFrequency = (term, docs) => {
    const docsWithTerm = docs.filter(doc => tokenize(doc).includes(term)).length;
    return Math.log(docs.length / (1 + docsWithTerm));
};

export const tfidf = (term, tokens, docs) => {
    return termFrequency(term, tokens) * inverseDocumentFrequency(term, docs);
};

export const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = (vecA, vecB) => {
        let product = 0;
        for (let key in vecA) {
            if (vecB.hasOwnProperty(key)) {
                product += vecA[key] * vecB[key];
            }
        }
        return product;
    };

    const magnitude = (vec) => {
        let sum = 0;
        for (let key in vec) {
            sum += Math.pow(vec[key], 2);
        }
        return Math.sqrt(sum);
    };

    vecA = normalize(vecA);
    vecB = normalize(vecB);

    return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
};

