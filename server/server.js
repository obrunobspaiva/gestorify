import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import https from "https"; // Para ignorar erros SSL

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); // 🔴 Importante para interpretar JSON no Express

const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

// Criamos um agente HTTPS para ignorar verificação de certificado SSL
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

app.post("/api/graphql", async (req, res) => { // 🔴 GARANTIA QUE A ROTA ACEITA SOMENTE `POST`
  try {
    console.log("🔵 Enviando requisição para Shopify...");
    const response = await axios.post( // 🔴 GARANTIA QUE A SHOPIFY RECEBE `POST`
      `https://${SHOPIFY_STORE}/admin/api/2024-01/graphql.json`,
      req.body, // 🔴 O corpo precisa estar correto!
      {
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          "Content-Type": "application/json",
        },
        httpsAgent, // Ignora verificação SSL
      }
    );

    console.log("🟢 Resposta da Shopify recebida:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("🔴 Erro ao chamar a Shopify:", error.response?.status, error.response?.data || error.message);
    res.status(500).json({
      message: "Erro ao chamar a Shopify",
      status: error.response?.status,
      error: error.response?.data || error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Backend rodando na porta ${PORT}`));
