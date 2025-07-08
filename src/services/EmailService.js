// src/services/EmailService.js

class EmailService {
  constructor() {
    this.apiUrl = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
  }

  // Send new match email notification
  async sendNewMatchEmail(matchData) {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch(`${this.apiUrl}/email/new-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          matchId: matchData._id,
          otherUser: matchData.otherUser,
          matchedAt: matchData.matchedAt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send new match email");
      }

      const result = await response.json();
      console.log("✅ New match email sent successfully:", result);
      return result.success;
    } catch (error) {
      console.error("❌ Error sending new match email:", error);
      // Don't throw error - we don't want to break the match flow if email fails
      return false;
    }
  }

  // Get email preferences
  async getEmailPreferences() {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch(`${this.apiUrl}/auth/email-preferences`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch email preferences");
      }

      const data = await response.json();
      return data.preferences;
    } catch (error) {
      console.error("Error fetching email preferences:", error);
      // Return default preferences if API fails
      return {
        newMatchNotifications: true,
        messageNotifications: true,
        likeNotifications: false,
        superLikeNotifications: true,
        weeklyMatchSummary: true,
        tipsAndAdvice: true,
        marketingEmails: false,
        eventUpdates: false,
        partnerOffers: false,
      };
    }
  }

  // Update email preferences
  async updateEmailPreferences(preferences) {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch(`${this.apiUrl}/auth/email-preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        throw new Error("Failed to update email preferences");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error updating email preferences:", error);
      throw error;
    }
  }

  // Check if user has enabled new match email notifications
  async shouldSendNewMatchEmail() {
    try {
      const preferences = await this.getEmailPreferences();
      return preferences.newMatchNotifications !== false; // Default to true if not set
    } catch (error) {
      console.error("Error checking email preferences:", error);
      return true; // Default to sending if we can't check preferences
    }
  }

  // Send test email
  async sendTestEmail(emailType = "new-match") {
    try {
      const token = localStorage.getItem("habibi_token");
      const response = await fetch(`${this.apiUrl}/email/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emailType }),
      });

      if (!response.ok) {
        throw new Error("Failed to send test email");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error sending test email:", error);
      return false;
    }
  }

  // Resend verification email
  async resendVerificationEmail(email) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend verification email");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error resending verification email:", error);
      return false;
    }
  }

  // Send password reset email
  async sendPasswordResetEmail(email) {
    try {
      const response = await fetch(`${this.apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error("Failed to send password reset email");
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error sending password reset email:", error);
      return false;
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;
