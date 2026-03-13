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

    /**
     * Predicts the safe harvest date based on treatment data.
     * @param {string} molecule - Drug name.
     * @param {string} species - Animal species.
     * @param {string} treatmentDate - YYYY-MM-DD.
     */
    predictSafeHarvest: async (molecule, species, treatmentDate) => {
        try {
            const response = await api.post('/ai/harvest-forecast/', {
                molecule,
                species,
                treatment_date: treatmentDate
            });
            return response;
        } catch (error) {
            console.error('AI Harvest Forecast Error:', error);
            throw error;
        }
    }
};

export default aiService;
