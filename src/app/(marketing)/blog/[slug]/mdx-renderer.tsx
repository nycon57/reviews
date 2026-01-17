"use client";

import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { mdxComponents } from "@/components/blog";

interface MDXRendererProps {
  source: MDXRemoteSerializeResult;
}

export function MDXRenderer({ source }: MDXRendererProps) {
  return <MDXRemote {...source} components={mdxComponents} />;
}
