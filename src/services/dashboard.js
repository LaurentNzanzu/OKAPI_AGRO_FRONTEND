import api from './api';

export const dashboardService = {
    getSummary: async () => {
        const { data } = await api.get('/dashboard/summary');
        return data;
    },
    getWidgets: async () => {
        const { data } = await api.get('/dashboard/widgets');
        return data;
    },
    createWidget: async (widget) => {
        const { data } = await api.post('/dashboard/widgets', widget);
        return data;
    },
    updateWidget: async (id, data) => {
        const { data: res } = await api.put(`/dashboard/widgets/${id}`, data);
        return res;
    },
    deleteWidget: async (id) => {
        await api.delete(`/dashboard/widgets/${id}`);
    },
    getWidgetData: async (type) => {
        const { data } = await api.get(`/dashboard/data/${type}`);
        return data;
    }
};