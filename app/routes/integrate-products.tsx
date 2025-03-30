// app/routes/integrate-products.tsx
import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { fetchProducts, createProduct } from "../utils.server";
import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";
import {
  Page,
  Button,
  Text,
  Card,
  BlockStack,
} from "@shopify/polaris";

export const action = async ({ request }: ActionFunctionArgs) => {
  // Replace these with your tokens and shop domains (or use environment variables)
  const storeAName = "storeA.myshopify.com";
  const storeAToken = "access-token-for-storeA";

  const storeBName = "storeB.myshopify.com";
  const storeBToken = "access-token-for-storeB";

  // Fetch products from Store A
  const products = await fetchProducts(storeAName, storeAToken);

  // Create products in Store B
  const createdProductIds: string[] = [];
  for (const product of products) {
    const productId = await createProduct(storeBName, storeBToken, product);
    if (productId) {
      createdProductIds.push(productId);
    }
  }

  // Return a JSON response with the created product IDs
  return json({ createdProducts: createdProductIds });
};


export default function IntegrateProducts() {
  // Type the fetcher data so TS knows about createdProducts
  const fetcher = useFetcher<{ createdProducts: string[] }>();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  // When products are created, show a notification
  useEffect(() => {
    if (fetcher.data?.createdProducts) {
      alert(`${fetcher.data.createdProducts.length} products were added!`);
    }
  }, [fetcher.data]);

  // Trigger the integration action
  const integrateProducts = () =>
    fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      {/* Replace TitleBar with a simple header DIV */}
      <div style={{ padding: "1rem 0", fontSize: "1.5rem", fontWeight: "bold" }}>
        Integrate Products Between Stores
      </div>

      <Button onClick={integrateProducts} loading={isLoading}>
        Integrate Products
      </Button>

      <BlockStack gap="500">
  <Card>
    <div style={{ padding: "16px" }}>
      <Text as="h2" variant="headingMd">
        Product Integration
      </Text>
      <Text as="p" variant="bodyMd">
        Click the button above to fetch products from Store A and add them to Store B using Shopify’s Admin GraphQL API.
      </Text>
    </div>
  </Card>
  {fetcher.data?.createdProducts && (
    <Card>
      <div style={{ padding: "16px" }}>
        <Text as="h2" variant="headingMd">
          Created Products
        </Text>
        <ul>
          {fetcher.data.createdProducts.map((id: string) => (
            <li key={id}>Product ID: {id}</li>
          ))}
        </ul>
      </div>
    </Card>
  )}
</BlockStack>

    </Page>
  );
}
