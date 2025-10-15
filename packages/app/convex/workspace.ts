import { query } from "./_generated/server";
import { requireUserId } from "./utils";

export const getWorkspaceTree = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireUserId(ctx);

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .collect();

    const sortedProjects = projects.sort((a, b) => b.createdAt - a.createdAt);

    const projectEntries = await Promise.all(
      sortedProjects.map(async (project) => {
        const documents = await ctx.db
          .query("documents")
          .withIndex("by_projectId", (q) => q.eq("projectId", project._id))
          .collect();

        const sortedDocuments = documents.sort((a, b) => b.updated - a.updated);

        return {
          project: {
            _id: project._id,
            name: project.name,
            handle: project.handle,
            createdAt: project.createdAt,
          },
          documents: sortedDocuments.map((document) => ({
            _id: document._id,
            title: document.title,
            updated: document.updated,
          })),
        };
      }),
    );

    return projectEntries;
  },
});
