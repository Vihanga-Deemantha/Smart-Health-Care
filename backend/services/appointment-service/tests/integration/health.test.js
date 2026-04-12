import request from "supertest";
import app from "../../app.js";

describe("GET /health", () => {
  it("should return 200", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
