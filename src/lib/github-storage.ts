// GitHub API integration for storing notes
// This uses GitHub as a file-based storage system for notes persistence

const GITHUB_API = "https://api.github.com";

export interface GitHubConfig {
  username: string;
  password: string; // GitHub personal access token
  repo: string;
  owner: string;
  branch: string;
}

export async function saveNoteToGitHub(
  config: GitHubConfig,
  noteKey: string,
  noteText: string
) {
  const filePath = `notes/${noteKey}.md`;
  const content = Buffer.from(noteText).toString("base64");

  try {
    // Get current file SHA if it exists
    let sha: string | undefined;
    try {
      const getResponse = await fetch(
        `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `${config.username}:${config.password}`
            ).toString("base64")}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );

      if (getResponse.ok) {
        const data = (await getResponse.json()) as { sha: string };
        sha = data.sha;
      }
    } catch {
      // File doesn't exist yet, that's fine
    }

    // Create or update the file
    const response = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Update note for ${noteKey}`,
          content,
          branch: config.branch,
          ...(sha && { sha }),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to save note to GitHub:", error);
    throw error;
  }
}

export async function getNoteFromGitHub(
  config: GitHubConfig,
  noteKey: string
): Promise<string | null> {
  const filePath = `notes/${noteKey}.md`;

  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.v3.raw",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return await response.text();
  } catch (error) {
    console.error("Failed to get note from GitHub:", error);
    throw error;
  }
}

export async function deleteNoteFromGitHub(
  config: GitHubConfig,
  noteKey: string
) {
  const filePath = `notes/${noteKey}.md`;

  try {
    // Get current file SHA
    const getResponse = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}?ref=${config.branch}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!getResponse.ok) {
      throw new Error(`File not found: ${getResponse.statusText}`);
    }

    const data = (await getResponse.json()) as { sha: string };

    // Delete the file
    const response = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/${filePath}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Delete note for ${noteKey}`,
          sha: data.sha,
          branch: config.branch,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error("Failed to delete note from GitHub:", error);
    throw error;
  }
}

export async function listNotesFromGitHub(config: GitHubConfig): Promise<string[]> {
  try {
    const response = await fetch(
      `${GITHUB_API}/repos/${config.owner}/${config.repo}/contents/notes?ref=${config.branch}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${config.username}:${config.password}`
          ).toString("base64")}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = (await response.json()) as Array<{ name: string }>;
    return data
      .filter((item) => item.name.endsWith(".md"))
      .map((item) => item.name.replace(".md", ""));
  } catch (error) {
    console.error("Failed to list notes from GitHub:", error);
    throw error;
  }
}
