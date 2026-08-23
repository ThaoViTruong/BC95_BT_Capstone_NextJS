"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";

import { validateCommentContent } from "@/lib/comment-validation";
import { cn } from "@/lib/utils";
import { commentFlowService } from "@/services/comment-flow.service";

type CommentFormProps = {
  roomId: number;
  isAuthenticated: boolean;
  canComment: boolean;
};

export function CommentForm({ roomId, isAuthenticated, canComment }: CommentFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentValidation = useMemo(() => validateCommentContent(content), [content]);
  const canSubmit = isAuthenticated && canComment && contentValidation.isValid && !isSubmitting;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!contentValidation.isValid) {
      toast.error(contentValidation.message);
      return;
    }

    try {
      setIsSubmitting(true);
      await commentFlowService.create({
        maPhong: roomId,
        noiDung: contentValidation.normalizedValue,
        saoBinhLuan: rating,
      });

      setContent("");
      setRating(5);
      toast.success("Gửi đánh giá thành công.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể gửi đánh giá.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-line bg-[linear-gradient(135deg,#eef4ff_0%,#ffffff_100%)] p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#0f2f8e]">
            Gửi đánh giá
          </p>
          <h3 className="mt-2 text-xl font-bold text-slate-950">Chia sẻ trải nghiệm lưu trú</h3>
        </div>
        <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
          {rating}/5 sao
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={cn(
              "inline-flex h-11 w-11 items-center justify-center rounded-full border transition",
              value <= rating
                ? "border-[#0f2f8e] bg-[#0f2f8e] text-white"
                : "border-line bg-white text-slate-400 hover:border-[#0f2f8e] hover:text-[#0f2f8e]",
            )}
            aria-label={`${value} sao`}
          >
            <Star className={cn("h-5 w-5", value <= rating ? "fill-current" : "")} />
          </button>
        ))}
      </div>

      {!isAuthenticated ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white px-4 py-4 text-sm leading-7 text-slate-600">
          Vui lòng <Link href="/tai-khoan" className="font-semibold text-[#0f2f8e]">đăng nhập</Link> bằng tài khoản khách hàng để gửi đánh giá.
        </div>
      ) : !canComment ? (
        <div className="mt-4 rounded-2xl border border-dashed border-line bg-white px-4 py-4 text-sm leading-7 text-slate-600">
          Chỉ khách hàng đã đặt phòng này mới có thể gửi đánh giá.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-slate-900">Nội dung đánh giá</span>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về phòng, tiện nghi và vị trí."
              rows={5}
              maxLength={1000}
              className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-[#0f2f8e]"
            />
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-slate-500">
              {contentValidation.isValid
                ? "Đánh giá sẽ được hiển thị sau khi gửi thành công."
                : contentValidation.message}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#0f2f8e] px-5 text-sm font-semibold text-white transition hover:bg-[#0b246d] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Đang gửi đánh giá" : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
