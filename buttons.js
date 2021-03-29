const buttons = {
    button_Goodmorning : {
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: 'Доброе утро'}]
            ], resize_keyboard: true
        })
    },
    button_taketime : {
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: 'Отпроситься'}]
            ], resize_keyboard: true
        })
    },
    button_yesno : {
        reply_markup: JSON.stringify({
            inline_keyboard: [
                [{ text: 'Да', callback_data: 'yes'}, { text: 'Нет', callback_data: 'no'}]
            ], one_time_keyboard: true
        })
    },
    button_timeon : {
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: 'Я Вернулся'}]
            ], resize_keyboard: true
        })
    },
    button_Goodbye : {
        reply_markup: JSON.stringify({
            keyboard: [
                [{ text: 'Добрый вечер'}]
            ], resize_keyboard: true
        })
    },
    button_clear : {
        reply_markup: {
            remove_keyboard: true
        }
    }
}

module.exports = { buttons }