# Pricing Model & Financial Calculation Rules

## 1. Overview
All financial calculations are centralized inside `features/pricing/services/pricing-service.ts`. Dashboard developers MUST NOT calculate prices, platform fees, or taxes inside React component files.

---

## 2. Standard Platform Constants (`config/services.ts`)

- **Platform Fee Percentage**: `5.0%`
- **Minimum Service Visit Charge**: `₹200.00`
- **GST / Tax Percentage**: `18.0%`
- **Currency**: INR (`₹`)

---

## 3. Calculation Formulas

### A. Platform Estimate (`calculatePlatformEstimate`)
$$\text{Effective Base} = \max(\text{Base Price}, \text{Minimum Visit Charge})$$
$$\text{Platform Fee} = \text{Effective Base} \times 0.05$$
$$\text{GST Tax} = \text{Platform Fee} \times 0.18$$
$$\text{Estimated Total} = \text{Effective Base} + \text{Platform Fee} + \text{GST Tax}$$

### B. Final Bill (`calculateFinalBill`)
$$\text{Service Fee} = \max(\text{Labor Charges}, \text{Minimum Visit Charge})$$
$$\text{Platform Fee} = \text{Service Fee} \times 0.05$$
$$\text{GST Tax} = (\text{Service Fee} + \text{Platform Fee}) \times 0.18$$
$$\text{Net Payable} = \text{Service Fee} + \text{Parts Charges} + \text{Platform Fee} + \text{GST Tax} - \text{Discount}$$
