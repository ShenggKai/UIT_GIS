window.COZE_TOKEN = import.meta.env.VITE_COZE_TOKEN;

new CozeWebSDK.WebChatClient({
    config: {
        bot_id: '7531007441476714503',
    },
    componentProps: {
        title: 'Coze',
    },
    auth: {
        type: 'token',
        token: window.COZE_TOKEN,
        onRefreshToken: function () {
            return window.COZE_TOKEN;
        }
    }
});
