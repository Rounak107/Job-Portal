import { Router } from "express";
import { sendTestEmailNow } from "../services/emailService";

const router = Router();

router.get("/test-email", async (req, res) => {
  try {
    const result = await sendTestEmailNow(
      "jobnowofficials@gmail.com",   // 👈 replace with YOUR Gmail to test
      "JobNow Test Email",
      { hello: "world" }
    );
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
