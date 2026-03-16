import api from './api';

const aiService = {
    /**
     * Fetches a grounded answer for a regulatory query.
     * @param {string} query - The user's question.
     * @param {string} species - Optional species filter (e.g., 'AVI', 'BOV').
     */
    getRegulatoryAnswer: async (query, species = '') => {
        try {
            const response = await api.post('/ai/regulatory-query/', { query, species });
            return response;
        } catch (error) {
            console.error('AI Regulatory Query Error:', error);
            throw error;
        }
    },

};

export default aiService;
