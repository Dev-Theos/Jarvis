/**
 * Hardware / device plugin architecture (Phase 6 scaffold).
 * Real Arduino/Pi adapters should implement DeviceAdapter and register here.
 */

export type DeviceTransport = 'http' | 'mqtt' | 'serial' | 'tcp';

export interface DeviceAdapter {
  id: string;
  name: string;
  transport: DeviceTransport;
  /** Reachability check — never assumes magic local discovery. */
  ping(): Promise<boolean>;
  /** Send a structured command after permission is granted upstream. */
  send(command: string, payload?: Record<string, unknown>): Promise<string>;
}

export class DeviceRegistry {
  private devices = new Map<string, DeviceAdapter>();

  register(device: DeviceAdapter): void {
    this.devices.set(device.id, device);
  }

  get(id: string): DeviceAdapter | undefined {
    return this.devices.get(id);
  }

  list(): DeviceAdapter[] {
    return [...this.devices.values()];
  }
}

/** Example: HTTP-connected Raspberry Pi home endpoint. */
export class HttpDeviceAdapter implements DeviceAdapter {
  transport: DeviceTransport = 'http';

  constructor(
    public id: string,
    public name: string,
    private baseUrl: string,
  ) {}

  async ping(): Promise<boolean> {
    try {
      const res = await fetch(new URL('/health', this.baseUrl), { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  }

  async send(command: string, payload: Record<string, unknown> = {}): Promise<string> {
    const res = await fetch(new URL('/command', this.baseUrl), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ command, payload }),
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`Device error ${res.status}: ${text.slice(0, 200)}`);
    return text;
  }
}

/**
 * Realistic integration notes:
 * - Arduino: USB serial (firmata/serialport) or Ethernet/Wi-Fi shield exposing HTTP.
 * - Raspberry Pi: small Flask/FastAPI/MQTT agent on the LAN; JARVIS talks HTTP/MQTT.
 * - Prefer local network + explicit pairing; do not scan the internet for devices.
 */
