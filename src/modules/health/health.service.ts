export class HealthService {
  getSystemStatus() {
    return {
      status: "UP",
      uptime: process.uptime(),
      system: "Anami Backend v1.0",
    };
  }
}
