const express = require('express');
const cors = require('cors');

const app = express();
const port = 3000;

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function returnNewImage(prompt,colors) {
  const response = await openai.images.generate({
    model: "dall-e",
    prompt: `Generate an image of a ${prompt} using the following colors: ${colors}`,
    n: 1,
    size: "256x256",
  });
  return response.data[0].url;
}

async function returnColorSchema(arg) { 
    const instructions = "Take a color or mood and return a color scheme in JSON format that represents the input well. Provide some information about why each color was picked as well";
    const assistant = await openai.beta.assistants.create({
      name: "Color Scheme Generator",
      instructions,
      tools: [],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" }
      });
    const thread = await openai.beta.threads.create();
  const message = await openai.beta.threads.messages.create(
      thread.id,
      {
        role: "user",
        content: arg
      }
    );
    const allMessages = [];
    let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { 
          assistant_id: assistant.id,
          instructions
        }
      );
      if (run.status === 'completed') {
        
        const messages = await openai.beta.threads.messages.list(
          run.thread_id
        );
        for (const message of messages.data.reverse()) {
          allMessages.push(message.content[0].text.value)
        }
      } else {
        console.log(run.status);
      }
      return allMessages;
  }

app.use(cors());

app.get('/v49/img/:prompt/:colors', async (req, res) => {
  const {prompt, colors} = req.params;
 const imgUrl = await returnNewImage(prompt,colors);
  res.status(200).json( imgUrl );   
});

app.get('/v1/colors/:arg', async (req, res) => {
    const arg = req.params.arg;
    const schema = await returnColorSchema(arg);
    res.status(200).json( {schema} );   
});
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});

