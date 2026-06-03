const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings';

export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'voyage-3-lite',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Voyage API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

export async function searchSimilar(
  queryEmbedding: number[],
  table: string,
  limit = 10
): Promise<unknown[]> {
  const { supabase } = await import('./supabase');

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_table: table,
    match_count: limit,
  });

  if (error) throw error;
  return data;
}
