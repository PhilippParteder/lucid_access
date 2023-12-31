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
let dreamsString = '';
async function getDreams() {
    const dreamsCollectionRef = admin.firestore().collection(collectionName);
    const snapshot = await dreamsCollectionRef.get();
    const dreams = [];
    snapshot.forEach((doc) => {
        dreams.push(doc.data());
    });

    dreams.forEach((dream) => {
        dreamsString = dreamsString + dream['content'];
    });
    return dreamsString;
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
            'Please scramble the following string of dreams that visitors of a gallery shared. Take important keywords and common themes and arrange them in a random way. Please do not separate the output by commas. Please only include the scrambled output, do not add any comments or extra text. There can be english and german entries, please keep the original language and do not translate everything to one language.  Make sure there are no racist, offensive and inappropriate entries in the final output. Here is the input I want you to scramble: ' +
                dreamsString
        );
        res.send(response['message']['content']);
    } catch (error) {
        res.status(500).send('Error: ' + error);
    }
});
app.get('/dreams', async (req, res) => {
    try {
        res.send(dreamsString);
    } catch (error) {
        res.status(500).send('Error: ' + error);
    }
});

app.listen(port, () => {
    console.log(`Example app listening on http://localhost:${port}`);
});
