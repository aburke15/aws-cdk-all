import * as aws from 'aws-sdk';
import * as lambda from 'aws-lambda';
import * as https from 'https';
import { GitHubProject } from '../lib/utils/types';

aws.config.update({ region: 'us-west-2' });

const apiVersion = {
  apiVersion: '2012-08-10',
};

let ddb = new aws.DynamoDB(apiVersion);

exports.handler = async (event: lambda.APIGatewayEvent) => {
  console.log(JSON.stringify(event, null, 2));

  try {
    if (!ddb) {
      ddb = new aws.DynamoDB(apiVersion);
    }

    const repos = await getReposFromGitHub();
    const projects = parseGitHubReposIntoProjects(repos);
    const recordCount = await insertProjectsIntoDynamo(ddb, projects);

    console.info(JSON.stringify(`Inserted ${recordCount} projects into GitHubTable`, null, 2));
  } catch (error) {
    console.error(JSON.stringify(error, null, 2));
  }
};

const getReposFromGitHub = (): Promise<any[]> => {
  const url = `https://api.github.com/users/${process.env.GITHUB_USER}/repos?per_page=100`;
  const options: https.RequestOptions = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `token ${process.env.GITHUB_PAT}`,
      'User-Agent': 'github-insert-project-lambda',
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunck) => {
        data += chunck;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error: any) {
          reject(new Error(error));
        }
      });
    });

    req.on('error', (error: any) => {
      reject(new Error(error));
    });
  });
};

export const parseGitHubReposIntoProjects = (repos: any[]): GitHubProject[] => {
  return repos.map((repo) => {
    const id: string = repo.id.toString();
    return {
      id,
      name: repo.name,
      createdAt: repo.create_at,
      description: repo.description ?? 'N/A',
      htmlUrl: repo.html_url,
      language: repo.language ?? 'N/A',
    } as GitHubProject;
  });
};

export const insertProjectsIntoDynamo = async (ddb: aws.DynamoDB, projects: GitHubProject[]): Promise<number> => {
  let count = 0;
  const tableName: string = process.env.TABLE_NAME!;

  const items = projects.map((project) => {
    count++;
    return ddb
      .putItem({
        TableName: tableName,
        Item: {
          id: { S: project.id },
          name: { S: project.name },
          createdAt: { S: project.createdAt },
          description: { S: project.description },
          htmlUrl: { S: project.htmlUrl },
          language: { S: project.language },
        },
      })
      .promise();
  });

  try {
    await Promise.all(items);
  } catch (error) {
    console.error('Error inserting projects into Dynamo table.', JSON.stringify(error, null, 2));
  }

  return count;
};
