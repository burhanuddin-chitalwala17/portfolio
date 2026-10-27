import { NextResponse } from "next/server";
import { isAdminRequest } from "../../../../services/auth/requireAdmin";
import { QUERY_STATUSES, setVisitorQueryStatus } from "../../../../services/queries/visitorQueries";

/**
 * PATCH /api/admin/queries/:id
 * Marks a visitor question as resolved or reopens it. Body: { status: "open" | "resolved" }
 */
export async function PATCH(request, { params }) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  const { id } = await params;
  const { status } = await request.json().catch(() => ({}));
  if (!Object.values(QUERY_STATUSES).includes(status)) {
    return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 });
  }
  try {
    const row = await setVisitorQueryStatus(id, status);
    if (!row) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Status update failed:", error);
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
