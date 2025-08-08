// netlify/functions/ratings.js

exports.handler = async (event) => {
  // import dinâmico de ESM
  const { Octokit } = await import('@octokit/rest');

  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
  const owner    = process.env.REPO_OWNER;
  const repo     = process.env.REPO_NAME; 
  const branch   = process.env.BRANCH_BARBER;
  const filePath = 'public/data/db.json';
  try {
    if (event.httpMethod === "GET") {
      // 1. Busca o conteúdo atual do db.json
      const { data: file } = await octokit.repos.getContent({
        owner, repo, path: filePath, ref: branch
      });
      const content = Buffer.from(file.content, "base64").toString();
      const { Ratings } = JSON.parse(content);
      return { statusCode: 200, body: JSON.stringify(Ratings) };
    }

    if (event.httpMethod === "POST") {
      const newRating = JSON.parse(event.body);
      // 2. Busca o arquivo (pra pegar sha e não sobrescrever errado)
      const { data: file } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
      const oldContent = Buffer.from(file.content, "base64").toString();
      const db = JSON.parse(oldContent);

      // 3. Adiciona novo rating
      db.Ratings.push(newRating);
      const updatedContent = Buffer.from(JSON.stringify(db, null, 2)).toString("base64");

      // 4. Comita de volta no GitHub
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: filePath,
        message: `chore: adiciona avaliação de ${newRating.clientName}`,
        content: updatedContent,
        sha: file.sha,
        branch
      });

      return { statusCode: 201, body: JSON.stringify({ success: true }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: err.message };
  }
}
