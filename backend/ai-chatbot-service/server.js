import "./src/config/env.js";
import app from "./app.js";

const PORT = Number(process.env.PORT) || 5031;

app.listen(PORT, () => {
  console.log(`AI chatbot service running on port ${PORT}`);
});
