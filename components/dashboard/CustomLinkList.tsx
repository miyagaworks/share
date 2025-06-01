// components/dashboard/CustomLinkList.tsx
"use client";
import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { DroppableProvided, DraggableProvided } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { HiLink, HiPencil, HiTrash } from "react-icons/hi";
import { deleteCustomLink, updateCustomLinkOrder } from "@/actions/sns";
import { CustomLinkEditForm } from "@/app/dashboard/links/components/CustomLinkEditForm";
import type { CustomLink } from "@prisma/client";
// 型キャストヘルパー - より明示的な型を使用
const DroppableComponent = Droppable as React.ComponentType<{
    droppableId: string;
    children: (provided: DroppableProvided) => React.ReactNode;
}>;
const DraggableComponent = Draggable as React.ComponentType<{
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided) => React.ReactNode;
}>;
interface CustomLinkListProps {
    links: CustomLink[];
    onUpdate: () => void;
    onEdit?: (id: string) => void;
}
export function CustomLinkList({ links, onUpdate, onEdit }: CustomLinkListProps) {
    const [items, setItems] = useState(links);
    const [isReordering, setIsReordering] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
    // リンク削除ハンドラー
    const handleDelete = async (id: string) => {
        try {
            setIsDeleting(id);
            const response = await deleteCustomLink(id);
            if (response.error) {
                throw new Error(response.error);
            }
            setItems(items.filter(item => item.id !== id));
            toast.success("カスタムリンクを削除しました");
            onUpdate();
        } catch (error) {
            toast.error("カスタムリンクの削除に失敗しました");
        } finally {
            setIsDeleting(null);
        }
    };
    // 編集完了時の処理
    const handleEditSuccess = () => {
        setEditingLinkId(null);
        onUpdate();
    };
    // ドラッグ&ドロップ完了ハンドラー
    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const reorderedItems = Array.from(items);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);
        setItems(reorderedItems);
        try {
            setIsReordering(true);
            const linkIds = reorderedItems.map(item => item.id);
            const response = await updateCustomLinkOrder(linkIds);
            if (response.error) {
                throw new Error(response.error);
            }
            toast.success("表示順を更新しました");
            onUpdate();
        } catch (error) {
            toast.error("表示順の更新に失敗しました");
        } finally {
            setIsReordering(false);
        }
    };
    if (items.length === 0) {
        return (
            <div className="bg-muted/30 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                    まだカスタムリンクがありません。「新規追加」から追加してください。
                </p>
            </div>
        );
    }
    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <DroppableComponent droppableId="custom-links">
                {(provided: DroppableProvided) => (
                    <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                    >
                        {items.map((link, index) => (
                            <DraggableComponent key={link.id} draggableId={link.id} index={index}>
                                {(provided: DraggableProvided) => (
                                    <li
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className="rounded-lg border bg-card"
                                    >
                                        {editingLinkId === link.id ? (
                                            <div className="p-4">
                                                <CustomLinkEditForm
                                                    link={link}
                                                    onCancel={() => setEditingLinkId(null)}
                                                    onSuccess={handleEditSuccess}
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between p-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                                                        <HiLink className="w-5 h-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{link.name}</p>
                                                        <p className="text-sm text-muted-foreground break-all max-w-[200px] sm:max-w-[300px]">
                                                            {link.url}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onEdit && onEdit(link.id)}
                                                        disabled={!!isDeleting || isReordering}
                                                    >
                                                        <HiPencil className="h-4 w-4" />
                                                        <span className="sr-only">編集</span>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDelete(link.id)}
                                                        disabled={isDeleting === link.id || isReordering}
                                                    >
                                                        {isDeleting === link.id ? (
                                                            "削除中..."
                                                        ) : (
                                                            <>
                                                                <HiTrash className="h-4 w-4" />
                                                                <span className="sr-only">削除</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </li>
                                )}
                            </DraggableComponent>
                        ))}
                        {provided.placeholder && (
                            <>{provided.placeholder}</>
                        )}
                    </ul>
                )}
            </DroppableComponent>
        </DragDropContext>
    );
}