
<old_str>// @ts-nocheck
import express from "express";
import https from "https";
import os from "os";

const router = express.Router();

router.get("/check-ip", async (req, res) => {
  try {
    // Obter interfaces de rede
    const networkInterfaces = os.networkInterfaces();
    const localIPs = [];

    // Extrair todos os IPs IPv4 não internos
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        interfaces.forEach((iface) => {
          // Filtrar apenas IPv4 e excluir endereços de loopback (127.0.0.1)
          if (iface.family === "IPv4" && !iface.internal) {
            localIPs.push({
              interface: interfaceName,
              ip: iface.address,
            });
          }
        });
      }
    });

    // Também obter o IP externo para referência
    let externalIP = null;
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      externalIP = data.ip;
    } catch (externalError) {
      // Não foi possível obter o IP externo
    }

    res.json({
      success: true,
      localIPs: localIPs,
      externalIP: externalIP,
      message:
        "Estes são os IPs da máquina onde o aplicativo está sendo executado",
    });
  } catch (error) {
    // Erro ao verificar IP
    res.status(500).json({
      success: false,
      error: "Erro ao verificar IP de saída",
    });
  }
});

export default router;</old_str>
<new_str>import express from "express";
import os from "os";

const router = express.Router();

router.get("/check-ip", async (req, res) => {
  try {
    // Obter interfaces de rede
    const networkInterfaces = os.networkInterfaces();
    const localIPs: Array<{ interface: string; ip: string }> = [];

    // Extrair todos os IPs IPv4 não internos
    Object.keys(networkInterfaces).forEach((interfaceName) => {
      const interfaces = networkInterfaces[interfaceName];
      if (interfaces) {
        interfaces.forEach((iface) => {
          // Filtrar apenas IPv4 e excluir endereços de loopback (127.0.0.1)
          if (iface.family === "IPv4" && !iface.internal) {
            localIPs.push({
              interface: interfaceName,
              ip: iface.address,
            });
          }
        });
      }
    });

    // Também obter o IP externo para referência
    let externalIP: string | null = null;
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      if (response.ok) {
        const data = await response.json();
        externalIP = data.ip;
      }
    } catch (externalError) {
      console.log("Não foi possível obter o IP externo:", externalError);
    }

    console.log("IPs encontrados:", { localIPs, externalIP });

    res.json({
      success: true,
      localIPs: localIPs,
      externalIP: externalIP,
      message: "Estes são os IPs da máquina onde o aplicativo está sendo executado",
    });
  } catch (error) {
    console.error("Erro ao verificar IP:", error);
    res.status(500).json({
      success: false,
      error: "Erro ao verificar IP de saída",
      details: error instanceof Error ? error.message : "Erro desconhecido"
    });
  }
});

export default router;</new_str>
