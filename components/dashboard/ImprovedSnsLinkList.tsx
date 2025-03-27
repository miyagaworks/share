// components/dashboard/ImprovedSnsLinkList.tsx
"use client";

import React, { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import type { DroppableProvided, DraggableProvided, DraggableStateSnapshot } from "@hello-pangea/dnd";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { SNS_METADATA, type SnsPlatform } from "@/types/sns";
import { deleteSnsLink, updateSnsLinkOrder } from "@/actions/sns";
import { ImprovedSnsIcon } from "@/components/shared/ImprovedSnsIcon";
import type { SnsLink } from "@prisma/client";
import { HiPencil, HiTrash, HiDotsVertical } from "react-icons/hi";

// 型キャストヘルパー
const DroppableComponent = Droppable as React.ComponentType<{
    droppableId: string;
    children: (provided: DroppableProvided) => React.ReactNode;
}>;

const DraggableComponent = Draggable as React.ComponentType<{
    draggableId: string;
    index: number;
    children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
}>;

interface ImprovedSnsLinkListProps {
    links: SnsLink[];
    onUpdate: () => void;
    onEdit: (id: string) => void;
}

export function ImprovedSnsLinkList({ links, onUpdate, onEdit }: ImprovedSnsLinkListProps) {
    console.log("Rendering ImprovedSnsLinkList");
    const [items, setItems] = useState(links);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // リンク削除ハンドラー
    const handleDelete = useCallback(async (id: string) => {
        try {
            setIsDeleting(id);
            setIsProcessing(true);

            const deletingLink = items.find(item => item.id === id);
            const platform = deletingLink ?
                SNS_METADATA[deletingLink.platform as SnsPlatform]?.name || deletingLink.platform :
                "SNS";

            const response = await deleteSnsLink(id);

            if (response.error) {
                throw new Error(response.error);
            }

            setItems(items.filter(item => item.id !== id));
            toast.success(`${platform}を削除しました`);
            onUpdate();
        } catch (error) {
            toast.error("SNSリンクの削除に失敗しました");
            console.error(error);
        } finally {
            setIsDeleting(null);
            setIsProcessing(false);
        }
    }, [items, onUpdate]);

    // ドラッグ&ドロップ完了ハンドラー
    const handleDragEnd = useCallback(async (result: DropResult) => {
        console.log("Drag End", result);
        if (!result.destination) return;

        const reorderedItems = Array.from(items);
        const [removed] = reorderedItems.splice(result.source.index, 1);
        reorderedItems.splice(result.destination.index, 0, removed);

        setItems(reorderedItems);

        try {
            setIsProcessing(true);
            console.log("Updating order", reorderedItems.map(i => i.id));

            const linkIds = reorderedItems.map(item => item.id);
            const response = await updateSnsLinkOrder(linkIds);

            if (response.error) {
                throw new Error(response.error);
            }

            toast.success("表示順を更新しました");
            onUpdate();
        } catch (error) {
            toast.error("表示順の更新に失敗しました");
            console.error("Order update error:", error);
            // エラー時に元の順序に戻す
            setItems(links);
        } finally {
            setIsProcessing(false);
        }
    }, [items, links, onUpdate]);

    if (items.length === 0) {
        return (
            <div className="bg-muted/30 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">
                    まだSNSリンクがありません。「新規追加」から追加してください。
                </p>
            </div>
        );
    }

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <DroppableComponent droppableId="sns-links-fixed-id">
                {(provided: DroppableProvided) => (
                    <div
                        className="space-y-3"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                    >
                        {items.map((link, index) => (
                            <DraggableComponent
                                key={link.id}
                                draggableId={link.id}
                                index={index}
                            >
                                {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                                    <div
                                        ref={dragProvided.innerRef}
                                        {...dragProvided.draggableProps}
                                        className={`rounded-lg border ${snapshot.isDragging ? 'shadow-md' : ''}`}
                                        style={{
                                            ...dragProvided.draggableProps.style,
                                            backgroundColor: 'white'
                                        }}
                                    >
                                        <div className="flex items-center justify-between p-3">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div
                                                    className="cursor-move"
                                                    {...dragProvided.dragHandleProps}
                                                >
                                                    <HiDotsVertical className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-primary/10">
                                                    <ImprovedSnsIcon
                                                        platform={link.platform as SnsPlatform}
                                                        size={24}
                                                        color="primary"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">
                                                        {SNS_METADATA[link.platform as SnsPlatform]?.name || link.platform}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground break-all max-w-[200px] sm:max-w-[300px]">
                                                        {link.url}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2 ml-2 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onEdit(link.id)}
                                                    disabled={isProcessing}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    <HiPencil className="h-4 w-4" />
                                                    <span className="sr-only">編集</span>
                                                </Button>
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(link.id)}
                                                    disabled={isProcessing}
                                                    className="w-8 h-8 p-0"
                                                >
                                                    {isDeleting === link.id ? (
                                                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin" />
                                                    ) : (
                                                        <HiTrash className="h-4 w-4" />
                                                    )}
                                                    <span className="sr-only">削除</span>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </DraggableComponent>
                        ))}
                        {provided.placeholder && (
                            <>{provided.placeholder}</>
                        )}
                    </div>
                )}
            </DroppableComponent>
        </DragDropContext>
    );
}