import TableCell from '../TableCell/TableCell'
import { FiTrash2 } from 'react-icons/fi'

export default function TableRow({ trade, onDelete }) {
  return (
    <tr>
      <TableCell center>{trade.ticker}</TableCell>
      <TableCell>{trade.strategy}</TableCell>
      <TableCell>{new Date(trade.entryTime).toLocaleString()}</TableCell>
      <TableCell>{new Date(trade.exitTime).toLocaleString()}</TableCell>
      <TableCell center>{trade.direction}</TableCell>
      <TableCell numeric>{trade.entryPrice}</TableCell>
      <TableCell numeric>{trade.stopLoss}</TableCell>
      <TableCell numeric>{trade.takeProfit}</TableCell>
      <TableCell numeric>{trade.lot}</TableCell>
      <TableCell numeric>{trade.riskPercent}%</TableCell>
      <TableCell numeric profit={parseFloat(trade.profit)}>
        {trade.profit}
      </TableCell>
      <TableCell center>
        <button
          onClick={() => onDelete(trade.id)}
          className="text-red-500 hover:text-red-700"
        >
          <FiTrash2 />
        </button>
      </TableCell>
    </tr>
  )
}