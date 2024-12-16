import { z } from 'zod';

export const modelSchema = z.object({
    name: z.string()
      .min(1, "Name is required")
      .max(50, "Name must be less than 50 characters"),
    
    version: z.string()
      .min(1, "Version is required")
      .regex(/^\d+\.\d+\.\d+$/, "Version must be in format x.x.x"),
    
    metadata_uri: z.string()
      .min(1, "Metadata URI is required")
      .startsWith("ipfs://", "URI must start with 'ipfs://'"),
    
    private_key: z.string()
      .min(1, "Private key is required")
      .regex(/^0x[a-fA-F0-9]{64}$/, "Invalid private key format")
  });