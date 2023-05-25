export function GET({view}) {
  return view(
    "blog.index",
    {
      title: "Blog",
      posts: [
        {
          title: 'Rust for a Rusty Game Developer',
          slug: 'rust-for-a-rusty-game-developer',
          publishedAt: '2019-01-31T16:31:00.000Z',
        },
        {
          title: 'Hello, World!',
          slug: 'hello-world',
          publishedAt: '2018-12-31T16:30:00.000Z',
        },
      ],
    },
  );
}
