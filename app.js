import express from 'express';
import admin from 'firebase-admin';
import OpenAI from 'openai';
import serviceAccount from '../BlenderFirebaseConnection/serviceAccountKey.json' assert { type: 'json' };

const openai = new OpenAI();

const app = express();
const port = 3000;
const collectionName = 'dreams';

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://lucid-journal-a7071.firebaseio.com',
});

async function getDreams() {
    try {
        const dreamsCollectionRef = admin
            .firestore()
            .collection(collectionName);
        const snapshot = await dreamsCollectionRef.get();

        const dreams = [];
        snapshot.forEach((doc) => {
            dreams.push(doc.data());
        });
        console.log(dreams);
    } catch (error) {
        return 'Error fetching dreams: ' + error;
    }
}
getDreams();

async function fetchGPTResponse(promptText) {
    const completion = await openai.chat.completions.create({
        messages: [{ role: 'system', content: promptText }],
        model: 'gpt-3.5-turbo',
    });
    return completion.choices[0];
}
app.get('/', async (req, res) => {
    try {
        const response = await fetchGPTResponse(
            'Erzähle mir etwas über JavaScript.'
        );
        console.log(response);
        res.send(response);
    } catch (error) {
        res.status(500).send('Error: ' + error);
    }
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});
