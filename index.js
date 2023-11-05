const line = require('@line/bot-sdk');
const axios = require('axios').default
const dotenv = require('dotenv')
const express =require('express')

const env = dotenv.config().parsed
const app = express()

const lineconfig ={
     channelAccessToken: env.ACCESS_TOKEN,
     channelSecret : env.SECRET_TOKEN
}

const client = new line.Client(lineconfig);

app.post('/webhook', line.middleware(lineconfig), async (req,res)=>{
    try{
        const events = req.body.events
        console.log('event-->',events)
        return events.length > 0 ? await events.map(item => handleEvent(item)) : res.status(200).send("OK")

    }catch(error){
        res.status(500).end()
    }
});

const handleEvent = async (event) =>{
    try{
    if (event.type !== 'message' || event.message.type !== 'text'){
        return client.replyMessage(event.replyToken, { type: 'text', text: "กรุณาใส่คำที่มีความหมาย" });
    }
    else if (event.type === 'message'){
        const {data}  = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${event.message.text}`)
        const nounMeaning = data[0]?.meanings.find(meaning => meaning.partOfSpeech === "noun");
        const verbMeaning = data[0]?.meanings.find(meaning => meaning.partOfSpeech === "verb");
        const nounDefinitions = nounMeaning?.definitions;
        const verbDefinitions = verbMeaning?.definitions;

        if (nounDefinitions) {
            let strN = "■ Noun : ";
            if (typeof nounDefinitions[0] === "string") {
                strN += `${nounDefinitions[0]}\n`;
            }else if (typeof nounDefinitions[0] === "object" && nounDefinitions[0].definition) {
                strN += `${nounDefinitions[0].definition}\n`;
            }
            if (verbDefinitions) {
                let strV = "■ verb: ";
                if (typeof verbDefinitions[0] === "string") {
                strV += `${verbDefinitions[0]}\n`;
                }else if (typeof verbDefinitions[0] === "object" && verbDefinitions[0].definition) {
                strV += `${verbDefinitions[0].definition}\n`;
                }
                strN += strV
            }
            console.log(strN);
            return client.replyMessage(event.replyToken, { type: 'text', text: strN });
        } 
        else {
            console.log("ไม่พบความหมาย noun");
            return client.replyMessage(event.replyToken, { type: 'text', text: "ไม่พบความหมาย noun" });
        }
    }
    }catch(error){
        console.log(error);
        return client.replyMessage(event.replyToken, { type: 'text', text: "กรุณาใส่คำภาษาอังกฤษที่มีความหมาย" });
    }
}

app.listen(4000,() => {
    console.log('Server listening on 4000')
});



