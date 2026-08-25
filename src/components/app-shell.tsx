"use client";

import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import { useEmployersPreviewTour } from "@/app/(website)/employers/EmployersPreviewTourContext";

const PREVIEW_SHELL_HEIGHT = "640px";
const PREVIEW_CONTENT_HEIGHT = "560px";

export function AppShell({
	children,
	className,
	preview = false,
}: {
	children: React.ReactNode;
	className?: string;
	preview?: boolean;
}) {
	const tour = useEmployersPreviewTour();
	const activePath = preview ? tour?.activePath : undefined;
	const pageTitle = preview ? tour?.activePage.title : undefined;

	return (
		<div
			className={preview ? "overflow-hidden" : "overflow-hidden"}
			style={preview ? { height: PREVIEW_SHELL_HEIGHT } : undefined}
		>
			<SidebarProvider
				className={cn(
					"relative",
					preview ? "h-full min-h-0" : "h-svh",
					className
				)}
			>
				<AppSidebar activePath={activePath} />
				<SidebarInset className="md:peer-data-[variant=inset]:ml-0 min-h-0">
					<AppHeader pageTitle={pageTitle} />
					<div
						className={cn(
							"flex flex-1 flex-col gap-4 bg-[#F8FAFC] p-4 md:p-6",
							preview
								? "min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
								: "overflow-y-auto"
						)}
						style={
							preview
								? {
										height: PREVIEW_CONTENT_HEIGHT,
										maxHeight: PREVIEW_CONTENT_HEIGHT,
									}
								: undefined
						}
					>
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
