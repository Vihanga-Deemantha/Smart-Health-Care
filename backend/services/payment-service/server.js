import "./src/config/env.js";
import app from "./app.js";
import connectDB from "./src/config/db.js";

const PORT = Number(process.env.PORT) || 5034;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Payment service running on port ${PORT}`);
  });
};

startServer();
