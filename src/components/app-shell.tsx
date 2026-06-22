import { cn } from "@/lib/utils";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";

export function AppShell({
	children,
	className,
	preview = false,
}: {
	children: React.ReactNode;
	className?: string;
	preview?: boolean;
}) {
	return (
		<div className={preview ? "overflow-visible" : "overflow-hidden"}>
			<SidebarProvider
				className={cn(
					"relative",
					preview ? "h-auto min-h-0" : "h-svh",
					className
				)}
			>
				<AppSidebar />
				<SidebarInset className="md:peer-data-[variant=inset]:ml-0">
					<AppHeader />
					<div
						className={cn(
							"flex flex-1 flex-col gap-4 p-4 md:p-6",
							preview ? "overflow-visible" : "overflow-y-auto"
						)}
					>
						{children}
					</div>
				</SidebarInset>
			</SidebarProvider>
		</div>
	);
}
