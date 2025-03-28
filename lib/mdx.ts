import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';

const postsDirectory = path.join(process.cwd(), 'content/posts');

export async function getPostBySlug(slug: string) {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(postsDirectory, `${realSlug}.mdx`);
  
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);
  
  const { content: mdxContent } = await compileMDX({
    source: content,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
      },
    },
  });

  return {
    content: mdxContent,
    frontmatter: {
      slug: realSlug,
      ...data,
    },
  };
}

export async function getAllPosts() {
  const slugs = fs.readdirSync(postsDirectory);
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await getPostBySlug(slug.replace(/\.mdx$/, ''));
      return post;
    })
  );

  // Sort posts by date
  return posts
    .filter(Boolean)
    .sort((post1, post2) => {
      if (post1?.frontmatter.date && post2?.frontmatter.date) {
        return post1.frontmatter.date > post2.frontmatter.date ? -1 : 1;
      }
      return 0;
    });
}