"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";

interface Author {
  name: string;
  role?: string;
  avatar?: string;
  bio?: string;
  twitter?: string;
  linkedin?: string;
}

interface AuthorBioCardProps {
  author: Author;
  className?: string;
}

export function AuthorBioCard({ author, className }: AuthorBioCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-6 p-6 rounded-2xl bg-repwell-sage-100/30 border border-repwell-sage-100",
        className
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {author.avatar ? (
          <Image
            src={author.avatar}
            alt={author.name}
            width={80}
            height={80}
            className="rounded-full ring-4 ring-white shadow-md"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-repwell-teal-300 flex items-center justify-center text-2xl font-bold text-white ring-4 ring-white shadow-md">
            {author.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="text-sm font-medium text-repwell-teal-300 uppercase tracking-wide mb-1">
          Written by
        </p>
        <h4 className="font-display text-xl font-bold text-repwell-teal-500 mb-1">
          {author.name}
        </h4>
        {author.role && (
          <p className="text-sm text-repwell-teal-400 mb-3">{author.role}</p>
        )}
        {author.bio && (
          <p className="text-repwell-teal-400 leading-relaxed mb-4">
            {author.bio}
          </p>
        )}

        {/* Social links */}
        {(author.twitter || author.linkedin) && (
          <div className="flex items-center gap-3">
            {author.twitter && (
              <Link
                href={`https://twitter.com/${author.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-repwell-sage-100 text-repwell-teal-400 hover:text-repwell-teal-300 hover:border-repwell-teal-300 transition-colors"
              >
                <Twitter className="h-4 w-4" />
              </Link>
            )}
            {author.linkedin && (
              <Link
                href={`https://linkedin.com/in/${author.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-white border border-repwell-sage-100 text-repwell-teal-400 hover:text-repwell-teal-300 hover:border-repwell-teal-300 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
