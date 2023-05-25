export function GET({view}) {
  return view(
    "[page]",
    {
      title: 'Home',
      content: "<h1>Welcome</h1>\n<p>My name is Nathan Knowler and this is my website. I’m originally from Vancouver, however, I now live in Winnipeg and work remotely as a Senior Frontend Developer at <a href=\"https://wearekettle.com\" rel=\"noreferrer\">Kettle</a>.</p>"
    },
  );
}
