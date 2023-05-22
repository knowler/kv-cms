import { authOrLogin } from "~/auth.js";
import kv from "~/kv.js";

export async function GET({request, params, view}) {
  await authOrLogin(request);
  const {collection, itemId} = params;

  const res = await kv.get([collection, itemId]);

  console.log(res);

  return view("sudo.[collection].[itemId]", {
    ...res.value,
  });
}

export async function POST({request, params}) {
  await authOrLogin(request);
  const {collection, itemId} = params;
  const formData = await request.formData();

  formData.get('title');
}
