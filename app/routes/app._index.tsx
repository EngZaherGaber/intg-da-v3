import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, Link as RemixLink } from "@remix-run/react";
import { Page, Layout, Text, Card, Button, BlockStack } from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  console.log(admin);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<any>();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  // If a generated product exists, we extract the productId (this is your existing logic)
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);

  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  return (
    <Page>
      {/* Replace TitleBar (if not available in your Polaris version) with a div styled as a header */}
      <div
        style={{
          padding: "1rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
        }}
      >
        <h1 style={{ flex: 1 }}>Remix App Template</h1>
        {/* Existing button to generate a product */}
        <Button onClick={generateProduct} loading={isLoading}>
          Generate a product
        </Button>
        {/* New button wrapped by Remix Link to route to /integrate-products */}
        <RemixLink to="/integrate-products" style={{ textDecoration: "none" }}>
          <Button>Go to Integrate Products</Button>
        </RemixLink>
      </div>

      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <div style={{ padding: "16px" }}>
                <Text as="h2" variant="headingMd">
                  Congrats on creating a new Shopify app 🎉
                </Text>
                <Text variant="bodyMd" as="p">
                  This embedded app template uses{" "}
                  <a
                    href="https://shopify.dev/docs/apps/tools/app-bridge"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    App Bridge
                  </a>{" "}
                  interface examples like an{" "}
                  <a
                    href="/app/additional"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    additional page in the app nav
                  </a>
                  , as well as an{" "}
                  <a
                    href="https://shopify.dev/docs/api/admin-graphql"
                    target="_blank"
                    rel="noreferrer"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    Admin GraphQL
                  </a>{" "}
                  mutation demo, to provide a starting point for app
                  development.
                </Text>
              </div>
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <div style={{ padding: "16px" }}>
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  {/* ...other specifications here */}
                </div>
              </Card>
              <Card>
                <div style={{ padding: "16px" }}>
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  {/* ...list next steps */}
                </div>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
