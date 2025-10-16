import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "No access token found. Please sign in with GitHub." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const owner = searchParams.get("owner")
    const repo = searchParams.get("repo")

    if (!owner || !repo) {
      return NextResponse.json(
        { error: "Missing owner or repo parameter" },
        { status: 400 }
      )
    }

    // Fetch repository info
    const repoResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    if (!repoResponse.ok) {
      const error = await repoResponse.json()
      return NextResponse.json(
        { error: error.message || "Failed to fetch repository" },
        { status: repoResponse.status }
      )
    }

    const repoData = await repoResponse.json()

    // Fetch recent commits
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/commits?per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    const commits = commitsResponse.ok ? await commitsResponse.json() : []

    // Fetch open issues
    const issuesResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    const issues = issuesResponse.ok ? await issuesResponse.json() : []

    // Fetch open pull requests
    const prsResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=10`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    )

    const pullRequests = prsResponse.ok ? await prsResponse.json() : []

    return NextResponse.json({
      repository: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        defaultBranch: repoData.default_branch,
        language: repoData.language,
        updatedAt: repoData.updated_at,
        htmlUrl: repoData.html_url,
      },
      commits: commits.slice(0, 5).map((commit: any) => ({
        sha: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
      })),
      issues: issues.map((issue: any) => ({
        number: issue.number,
        title: issue.title,
        state: issue.state,
        createdAt: issue.created_at,
        url: issue.html_url,
        labels: issue.labels.map((label: any) => label.name),
      })),
      pullRequests: pullRequests.map((pr: any) => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        createdAt: pr.created_at,
        url: pr.html_url,
        author: pr.user.login,
      })),
    })
  } catch (error) {
    console.error("[GitHub API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
