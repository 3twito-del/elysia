const fallbackSupportEmail = "3twito@gmail.com";
const fallbackSupportPhone = "054-727-7455";
const fallbackSupportPhoneE164 = "+972547277455";

function getEnvValue(name: string, fallback: string) {
  const value = process.env[name]?.trim();

  if (value === undefined || value.length === 0) return fallback;

  return value;
}

function getWhatsappNumber(phoneE164: string) {
  return phoneE164.replace(/^\+/, "");
}

export const siteContact = {
  email: getEnvValue(
    "SUPPORT_EMAIL",
    getEnvValue("OPERATIONS_EMAIL", fallbackSupportEmail),
  ),
  phoneDisplay: getEnvValue("SUPPORT_PHONE", fallbackSupportPhone),
  phoneE164: getEnvValue("SUPPORT_PHONE_E164", fallbackSupportPhoneE164),
};

export const siteWhatsapp = getEnvValue(
  "SUPPORT_WHATSAPP",
  getWhatsappNumber(siteContact.phoneE164),
);
