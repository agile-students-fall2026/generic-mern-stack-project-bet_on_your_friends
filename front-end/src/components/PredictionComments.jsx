import { useState } from 'react'
import { getDisplayName, useAuth } from '../context/auth'
import { addMockComment, minCommentLength, maxCommentLength} from '../services/mockPredictions'

// shows a prediction's comments and lets members post a reply
function PredictionComments({ data, prediction, onUpdate }) {
  const { user } = useAuth()
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const comments = prediction.comments || []
  const tooShort = draft.trim().length < minCommentLength
  const tooLong = draft.length > maxCommentLength
  const canSend = !tooShort && !tooLong && !sending

  function handleCancel() {
    setDraft('')
    setError('')
    setEditing(false)
  }

  async function handleSend(event) {
    event.preventDefault()
    if (!canSend) return

    setSending(true)
    setError('')

    try {
      // clear the draft only after saving succeeds
      await addMockComment(data, prediction.id, draft)
      setDraft('')
      setEditing(false)
      onUpdate()
    } catch (problem) {
      setError(problem.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <section
      aria-labelledby="comments-title"
      className="rounded-xl border border-gray-200 bg-white p-4"
    >
      <h3 id="comments-title" className="text-lg font-bold">
        Comments ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">No comments posted yet.</p>
      )}

      {/* keep long comment threads scrollable */}
      {comments.length > 0 && (
        <div
          role="region"
          aria-label="Prediction comments"
          tabIndex={0}
          className="mt-3 max-h-72 space-y-4 overflow-y-auto overscroll-contain pr-2 focus:outline-nyu-violet"
        >
          {comments.map((comment) => {
            let author = data.users.find(
              (person) => person.id === comment.userId
            )

            // use your current profile in case your name or photo changed
            if (comment.userId === user.id) {
              author = user
            }

            return (
              <article
                key={comment.id}
                className="border-b border-gray-200 pb-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      author?.photoUrl ||
                      `https://picsum.photos/seed/user-${comment.userId}/64/64`
                    }
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold">
                      {author ? getDisplayName(author) : 'Former member'}
                      {comment.userId === data.currentUserId && ' (You)'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm">
                  {comment.text}
                </p>
              </article>
            )
          })}
        </div>
      )}

      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white"
        >
          Add comment
        </button>
      ) : (
        <form onSubmit={handleSend} className="mt-4">
          <label htmlFor="comment-draft" className="block font-medium">
            Your comment · draft
          </label>
          <textarea
            id="comment-draft"
            autoFocus
            rows={4}
            value={draft}
            disabled={sending}
            aria-describedby="comment-count"
            aria-invalid={tooLong}
            onChange={(event) => {
              setDraft(event.target.value)
              setError('')
            }}
            className="mt-2 w-full rounded-lg border border-gray-300 p-3"
          />

          <p
            id="comment-count"
            className={`mt-1 text-sm ${tooLong ? 'text-red-600' : 'text-gray-500'}`}
          >
            {draft.length} / {maxCommentLength} characters · Not posted yet
          </p>

          {tooLong && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              Keep your comment within 500 characters.
            </p>
          )}
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSend}
            className="mt-3 w-full rounded-lg bg-nyu-violet p-3 font-semibold text-white disabled:bg-gray-300"
          >
            {sending ? 'Sending...' : 'Send comment'}
          </button>
          <button
            type="button"
            disabled={sending}
            onClick={handleCancel}
            className="mt-2 w-full rounded-lg border border-gray-300 p-3 font-semibold"
          >
            Cancel
          </button>
        </form>
      )}
    </section>
  )
}

export default PredictionComments