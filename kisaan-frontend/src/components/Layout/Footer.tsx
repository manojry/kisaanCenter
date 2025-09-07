import { Leaf } from "lucide-react"

const Footer = () => {
  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-primary p-1.5 rounded-lg">
            <Leaf className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-semibold">KisaanCenter</span>
        </div>
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built for farmers, by farmers. Empowering agricultural communities worldwide.
        </p>
      </div>
    </footer>
  )
}

export default Footer