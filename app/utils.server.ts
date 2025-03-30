// app/utils.server.ts
import axios from "axios";

// Fetch products from a source store (Store A)
export const fetchProducts = async (shop: string, token: string) => {
  const query = `
    {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
            variants(first: 3) {
              edges {
                node {
                  title
                  price
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shop}/admin/api/2023-01/graphql.json`,
      { query },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
      }
    );

    return response.data.data.products.edges.map((edge: any) => edge.node);
  } catch (error: any) {
    console.error(`Error fetching products from ${shop}:`, error.message);
    return [];
  }
};

// Create a product in the destination store (Store B)
export const createProduct = async (shop: string, token: string, product: any) => {
  // Build mutation string. We stringify the variants array.
  const mutation = `
    mutation {
      productCreate(input: {
        title: "${product.title}",
        descriptionHtml: "${product.description}",
        variants: ${JSON.stringify(
          product.variants.edges.map((edge: any) => ({
            title: edge.node.title,
            price: edge.node.price,
          }))
        )}
      }) {
        product {
          id
        }
      }
    }
  `;

  try {
    const response = await axios.post(
      `https://${shop}/admin/api/2023-01/graphql.json`,
      { query: mutation },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
      }
    );

    return response.data.data.productCreate.product.id;
  } catch (error: any) {
    console.error(`Error creating product in ${shop}:`, error.message);
    return null;
  }
};
