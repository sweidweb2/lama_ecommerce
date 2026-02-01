import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TableWrapper } from "@/components/admin/table-wrapper"
import { Star } from "lucide-react"

// Dummy data
const reviews = [
  {
    id: "1",
    product: "Wireless Headphones",
    user: "John Doe",
    rating: 5,
    comment: "Great product, highly recommend!",
    date: "2024-01-15",
    status: "Published",
  },
  {
    id: "2",
    product: "Smart Watch",
    user: "Jane Smith",
    rating: 4,
    comment: "Good quality, but battery could be better.",
    date: "2024-01-16",
    status: "Published",
  },
  {
    id: "3",
    product: "Laptop Stand",
    user: "Bob Johnson",
    rating: 3,
    comment: "It's okay, nothing special.",
    date: "2024-01-16",
    status: "Pending",
  },
  {
    id: "4",
    product: "Mechanical Keyboard",
    user: "Alice Williams",
    rating: 5,
    comment: "Amazing keyboard, love the feel!",
    date: "2024-01-17",
    status: "Published",
  },
]

const renderStars = (rating: number) => {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Reviews</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          Manage product reviews and ratings
        </p>
      </div>

      <TableWrapper>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell className="font-medium">{review.product}</TableCell>
                <TableCell>{review.user}</TableCell>
                <TableCell>{renderStars(review.rating)}</TableCell>
                <TableCell className="max-w-md truncate">
                  {review.comment}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      review.status === "Published" ? "default" : "secondary"
                    }
                  >
                    {review.status}
                  </Badge>
                </TableCell>
                <TableCell>{review.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </div>
  )
}
