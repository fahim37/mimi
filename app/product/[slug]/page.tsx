import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductDetail from "@/app/shop/product-detail";
import { getProduct, products, relatedProducts } from "@/app/shop/products";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) return { title: "Piece not found — Mimi" };

  return {
    title: `${product.name} — Mimi`,
    description: product.tagline,
    openGraph: {
      title: `${product.name} — Mimi`,
      description: product.tagline,
      images: [{ url: product.images[0].src }],
    },
  };
}

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = getProduct(slug);
  if (!product) notFound();

  return <ProductDetail key={product.slug} product={product} related={relatedProducts(slug)} />;
}
