window.COZE_TOKEN = import.meta.env.VITE_COZE_TOKEN;
window.COZE_BOT_ID = import.meta.env.VITE_COZE_BOT_ID;

new CozeWebSDK.WebChatClient({
    config: {
        bot_id: window.COZE_BOT_ID,
    },
    componentProps: {
        title: 'Chat with UIT Bot',
    },
    auth: {
        type: 'token',
        token: window.COZE_TOKEN,
        onRefreshToken: function () {
            return window.COZE_TOKEN;
        }
    }
});
