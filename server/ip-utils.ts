
import os from "os";

export interface IPInfo {
  localIPs: Array<{ interface: string; ip: string }>;
  externalIP: string | null;
}

export async function getServerIPs(): Promise<IPInfo> {
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

  // Obter o IP externo
  let externalIP: string | null = null;
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (response.ok) {
      const data = await response.json();
      externalIP = data.ip;
    }
  } catch (error) {
    console.log("Não foi possível obter o IP externo:", error);
  }

  return { localIPs, externalIP };
}
