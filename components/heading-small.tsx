export default function HeadingSmall({ title, description }: { title: string; description?: string }) {
    return (
        <header className="mb-8 mt-2">
            <h3 className="text-2xl lg:text-3xl font-bold tracking-tight mb-1">{title}</h3>
            {description && <p className="text-muted-foreground text-base lg:text-lg max-w-2xl">{description}</p>}
        </header>
    );
}
